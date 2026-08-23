using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services;

namespace YoutubeDownloader.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DownloadsController : ControllerBase
    {
        private readonly DownloadQueueManager _queueManager;

        public DownloadsController(DownloadQueueManager queueManager)
        {
            _queueManager = queueManager;
        }

        [HttpGet]
        public ActionResult<List<DownloadItem>> GetDownloads()
        {
            return Ok(_queueManager.GetAllDownloads());
        }

        [HttpPost("start")]
        public ActionResult<DownloadItem> StartDownload([FromBody] StartDownloadRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Url)) return BadRequest("URL is required.");
            var item = _queueManager.EnqueueDownload(request);
            return Ok(item);
        }

        [HttpPost("{id}/cancel")]
        public IActionResult CancelDownload(string id)
        {
            bool success = _queueManager.CancelDownload(id);
            if (!success) return NotFound();
            return Ok();
        }

        [HttpDelete("clear")]
        public IActionResult ClearHistory()
        {
            _queueManager.ClearHistory();
            return Ok();
        }
    }
}
