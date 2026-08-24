using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DownloadsController : ControllerBase
    {
        private readonly IDownloadQueueService _queueService;

        public DownloadsController(IDownloadQueueService queueService)
        {
            _queueService = queueService;
        }

        [HttpGet]
        public ActionResult<List<DownloadItem>> GetDownloads()
        {
            return Ok(_queueService.GetAllDownloads());
        }

        [HttpPost]
        public ActionResult<DownloadItem> StartDownload([FromBody] StartDownloadRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Url)) return BadRequest("URL cannot be empty.");
            var item = _queueService.EnqueueDownload(request);
            return Ok(item);
        }

        [HttpPost("{id}/cancel")]
        public IActionResult CancelDownload(string id)
        {
            bool cancelled = _queueService.CancelDownload(id);
            if (!cancelled) return NotFound();
            return Ok();
        }

        [HttpPost("clear-history")]
        public IActionResult ClearHistory()
        {
            _queueService.ClearHistory();
            return Ok();
        }
    }
}
